import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;
import 'dart:convert';
import '../config.dart';

class StudentProgressScreen extends StatefulWidget {
  final String token;
  final VoidCallback onLogout;

  const StudentProgressScreen({
    Key? key,
    required this.token,
    required this.onLogout,
  }) : super(key: key);

  @override
  _StudentProgressScreenState createState() => _StudentProgressScreenState();
}

class _StudentProgressScreenState extends State<StudentProgressScreen> {
  List<dynamic> students = [];
  List<dynamic> bookings = [];
  Map<String, dynamic>? selectedStudent;
  bool loading = true;
  bool isStudentMode = false;

  @override
  void initState() {
    super.initState();
    fetchData();
  }

  Map<String, dynamic> _decodeJwt(String token) {
    try {
      final parts = token.split('.');
      if (parts.length != 3) return {};
      String payload = parts[1];
      if (payload.length % 4 > 0) {
        payload += '=' * (4 - payload.length % 4);
      }
      final resp = utf8.decode(base64Url.decode(payload));
      return jsonDecode(resp);
    } catch (_) {
      return {};
    }
  }

  Future<void> fetchData() async {
    setState(() => loading = true);
    try {
      final resUsers = await http.get(
        Uri.parse('${Config.baseUrl}/api/users/'),
        headers: {'Authorization': 'Bearer ${widget.token}'},
      );
      final resBookings = await http.get(
        Uri.parse('${Config.baseUrl}/api/bookings/'),
        headers: {'Authorization': 'Bearer ${widget.token}'},
      );

      if (resUsers.statusCode == 200 && resBookings.statusCode == 200) {
        final List allUsers = jsonDecode(resUsers.body);
        final List allBookings = jsonDecode(resBookings.body);

        final jwtPayload = _decodeJwt(widget.token);
        final currentUserId = jwtPayload['user_id'] ?? jwtPayload['id'] ?? jwtPayload['sub'];

        Map<String, dynamic>? currentUser;
        if (currentUserId != null) {
          try {
            currentUser = allUsers.firstWhere(
              (u) => u['id'].toString() == currentUserId.toString(),
            );
          } catch (_) {}
        }

        bool studentMode = false;
        if (currentUser != null && currentUser['role'] == 'Student Pilot') {
          studentMode = true;
        }

        setState(() {
          students = allUsers.where((u) => u['role'] == 'Student Pilot').toList();
          bookings = allBookings;
          isStudentMode = studentMode;
          if (isStudentMode) {
            selectedStudent = currentUser;
          }
          loading = false;
        });
      } else {
        setState(() => loading = false);
        if (resUsers.statusCode == 401 || resBookings.statusCode == 401) {
          widget.onLogout();
        }
      }
    } catch (e) {
      setState(() => loading = false);
    }
  }

  double _calculateTotalHours() {
    if (selectedStudent == null) return 0.0;
    final studentBookings = bookings.where((b) {
      final bStudent = b['student'];
      final bStudentId = bStudent is Map ? bStudent['id'] : bStudent;
      return bStudentId.toString() == selectedStudent!['id'].toString() && b['status'] == 'Completed';
    }).toList();

    int totalMinutes = 0;
    for (var b in studentBookings) {
      final start = DateTime.tryParse(b['start_time'] ?? '');
      final end = DateTime.tryParse(b['end_time'] ?? '');
      if (start != null && end != null) {
        totalMinutes += end.difference(start).inMinutes;
      }
    }
    return totalMinutes / 60.0;
  }

  @override
  Widget build(BuildContext context) {
    if (loading) {
      return Center(
        child: Text(
          'Loading Logbooks...',
          style: TextStyle(color: Theme.of(context).colorScheme.onSurface.withOpacity(0.6)),
        ),
      );
    }

    return LayoutBuilder(
      builder: (context, constraints) {
        if (constraints.maxWidth > 800) {
          // Wide layout
          return Padding(
            padding: const EdgeInsets.all(16.0),
            child: Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                if (!isStudentMode)
                  Expanded(
                    flex: 1,
                    child: _buildStudentList(),
                  ),
                if (!isStudentMode) SizedBox(width: 16),
                Expanded(
                  flex: 2,
                  child: _buildDetailView(),
                ),
              ],
            ),
          );
        } else {
          // Narrow layout
          return Padding(
            padding: const EdgeInsets.all(16.0),
            child: (!isStudentMode && selectedStudent == null)
                ? _buildStudentList()
                : _buildDetailView(),
          );
        }
      },
    );
  }

  Widget _buildStudentList() {
    final colorScheme = Theme.of(context).colorScheme;
    final outlineColor = colorScheme.onSurface.withOpacity(0.2);

    return Card(
      elevation: 0,
      margin: EdgeInsets.zero,
      shape: RoundedRectangleBorder(
        side: BorderSide(color: outlineColor),
        borderRadius: BorderRadius.circular(12),
      ),
      child: Column(
        children: [
          Container(
            padding: EdgeInsets.symmetric(horizontal: 16, vertical: 12),
            decoration: BoxDecoration(
              color: colorScheme.onSurface.withOpacity(0.05),
              borderRadius: BorderRadius.vertical(top: Radius.circular(12)),
              border: Border(bottom: BorderSide(color: outlineColor)),
            ),
            child: Row(
              children: [
                Icon(Icons.account_circle, size: 20, color: colorScheme.onSurface.withOpacity(0.7)),
                SizedBox(width: 8),
                Text(
                  'Students',
                  style: TextStyle(
                    fontSize: 16,
                    fontWeight: FontWeight.bold,
                    color: colorScheme.onSurface,
                  ),
                ),
              ],
            ),
          ),
          Expanded(
            child: ListView.separated(
              itemCount: students.length,
              separatorBuilder: (context, index) => Divider(height: 1, color: outlineColor),
              itemBuilder: (context, index) {
                final student = students[index];
                final isSelected = selectedStudent != null && selectedStudent!['id'] == student['id'];
                
                return ListTile(
                  tileColor: isSelected ? colorScheme.primary.withOpacity(0.1) : null,
                  leading: CircleAvatar(
                    backgroundColor: colorScheme.onSurface.withOpacity(0.1),
                    child: Text(
                      (student['full_name'] ?? '?')[0].toUpperCase(),
                      style: TextStyle(color: colorScheme.onSurface.withOpacity(0.7), fontWeight: FontWeight.bold),
                    ),
                  ),
                  title: Text(
                    student['full_name'] ?? 'Unknown',
                    style: TextStyle(
                      color: colorScheme.onSurface,
                      fontWeight: FontWeight.bold,
                    ),
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                  ),
                  subtitle: Text(
                    student['email'] ?? '',
                    style: TextStyle(color: colorScheme.onSurface.withOpacity(0.7)),
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                  ),
                  onTap: () {
                    setState(() {
                      selectedStudent = student;
                    });
                  },
                );
              },
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildDetailView() {
    final colorScheme = Theme.of(context).colorScheme;
    final outlineColor = colorScheme.onSurface.withOpacity(0.2);

    if (selectedStudent == null) {
      return Card(
        elevation: 0,
        margin: EdgeInsets.zero,
        shape: RoundedRectangleBorder(
          side: BorderSide(color: outlineColor),
          borderRadius: BorderRadius.circular(12),
        ),
        child: Center(
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Icon(Icons.account_circle, size: 64, color: colorScheme.onSurface.withOpacity(0.3)),
              SizedBox(height: 16),
              Text(
                'Select a student from the list to view their progress.',
                style: TextStyle(fontSize: 16, color: colorScheme.onSurface.withOpacity(0.6)),
                textAlign: TextAlign.center,
              ),
            ],
          ),
        ),
      );
    }

    final double totalHours = _calculateTotalHours();
    final studentBookings = bookings.where((b) {
      final bStudent = b['student'];
      final bStudentId = bStudent is Map ? bStudent['id'] : bStudent;
      return bStudentId.toString() == selectedStudent!['id'].toString() && b['status'] == 'Completed';
    }).toList();

    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        if (!isStudentMode && MediaQuery.of(context).size.width <= 800)
          Padding(
            padding: const EdgeInsets.only(bottom: 16.0),
            child: Align(
              alignment: Alignment.centerLeft,
              child: TextButton.icon(
                icon: Icon(Icons.arrow_back),
                label: Text('Back to Students'),
                onPressed: () {
                  setState(() => selectedStudent = null);
                },
              ),
            ),
          ),
        Card(
          elevation: 0,
          margin: EdgeInsets.zero,
          shape: RoundedRectangleBorder(
            side: BorderSide(color: outlineColor),
            borderRadius: BorderRadius.circular(12),
          ),
          child: Padding(
            padding: const EdgeInsets.all(16.0),
            child: Wrap(
              alignment: WrapAlignment.spaceBetween,
              crossAxisAlignment: WrapCrossAlignment.center,
              spacing: 16,
              runSpacing: 16,
              children: [
                Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    CircleAvatar(
                      radius: 32,
                      backgroundColor: colorScheme.primary.withOpacity(0.1),
                      child: Text(
                        (selectedStudent!['full_name'] ?? '?')[0].toUpperCase(),
                        style: TextStyle(
                          color: colorScheme.primary,
                          fontSize: 24,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                    ),
                    SizedBox(width: 16),
                    Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          selectedStudent!['full_name'] ?? 'Unknown',
                          style: TextStyle(
                            fontSize: 20,
                            fontWeight: FontWeight.bold,
                            color: colorScheme.onSurface,
                          ),
                        ),
                        Text(
                          'Student Pilot Candidate',
                          style: TextStyle(color: colorScheme.onSurface.withOpacity(0.7)),
                        ),
                      ],
                    ),
                  ],
                ),
                Column(
                  crossAxisAlignment: CrossAxisAlignment.end,
                  children: [
                    Text(
                      'TOTAL FLIGHT TIME',
                      style: TextStyle(
                        fontSize: 12,
                        fontWeight: FontWeight.bold,
                        color: colorScheme.onSurface.withOpacity(0.7),
                      ),
                    ),
                    Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Icon(Icons.schedule, color: colorScheme.primary),
                        SizedBox(width: 4),
                        Text(
                          '${totalHours.toStringAsFixed(1)}',
                          style: TextStyle(
                            fontSize: 28,
                            fontWeight: FontWeight.w900,
                            color: colorScheme.primary,
                          ),
                        ),
                        SizedBox(width: 4),
                        Text('hrs', style: TextStyle(color: colorScheme.onSurface.withOpacity(0.7))),
                      ],
                    ),
                  ],
                ),
              ],
            ),
          ),
        ),
        SizedBox(height: 16),
        Expanded(
          child: Card(
            elevation: 0,
            margin: EdgeInsets.zero,
            shape: RoundedRectangleBorder(
              side: BorderSide(color: outlineColor),
              borderRadius: BorderRadius.circular(12),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                Container(
                  padding: EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                  decoration: BoxDecoration(
                    color: colorScheme.onSurface.withOpacity(0.05),
                    borderRadius: BorderRadius.vertical(top: Radius.circular(12)),
                    border: Border(bottom: BorderSide(color: outlineColor)),
                  ),
                  child: Row(
                    children: [
                      Icon(Icons.menu_book, size: 20, color: colorScheme.onSurface.withOpacity(0.7)),
                      SizedBox(width: 8),
                      Text(
                        'Digital Logbook & Grades',
                        style: TextStyle(
                          fontSize: 16,
                          fontWeight: FontWeight.bold,
                          color: colorScheme.onSurface,
                        ),
                      ),
                    ],
                  ),
                ),
                Expanded(
                  child: studentBookings.isEmpty
                      ? Center(
                          child: Text(
                            'No completed flights found for this student.',
                            style: TextStyle(color: colorScheme.onSurface.withOpacity(0.7)),
                          ),
                        )
                      : ListView.separated(
                          itemCount: studentBookings.length,
                          separatorBuilder: (context, index) => Divider(height: 1, color: outlineColor),
                          itemBuilder: (context, index) {
                            final b = studentBookings[index];
                            final startDate = DateTime.tryParse(b['start_time'] ?? '');
                            final dateStr = startDate != null
                                ? '${startDate.month}/${startDate.day}/${startDate.year}'
                                : '-';
                            
                            final bRes = b['resource'];
                            final resourceName = bRes is Map ? (bRes['name'] ?? '-') : '-';
                            
                            final bInst = b['instructor'];
                            final instructorName = bInst is Map ? (bInst['full_name'] ?? 'Solo') : (bInst != null ? 'Instructor' : 'Solo');
                            
                            final grade = b['grade'];
                            final notes = b['instructor_notes'] ?? '-';

                            return ListTile(
                              title: Row(
                                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                children: [
                                  Text(
                                    dateStr,
                                    style: TextStyle(
                                      fontWeight: FontWeight.bold,
                                      color: colorScheme.onSurface,
                                    ),
                                  ),
                                  if (grade != null)
                                    Container(
                                      padding: EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                                      decoration: BoxDecoration(
                                        color: Colors.green.withOpacity(0.2),
                                        borderRadius: BorderRadius.circular(8),
                                      ),
                                      child: Row(
                                        mainAxisSize: MainAxisSize.min,
                                        children: [
                                          Icon(Icons.emoji_events, size: 14, color: Colors.green),
                                          SizedBox(width: 4),
                                          Text(
                                            grade.toString(),
                                            style: TextStyle(
                                              fontSize: 12,
                                              fontWeight: FontWeight.bold,
                                              color: Colors.green,
                                            ),
                                          ),
                                        ],
                                      ),
                                    ),
                                ],
                              ),
                              subtitle: Padding(
                                padding: const EdgeInsets.only(top: 4.0),
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Text(
                                      'Aircraft: $resourceName | Instructor: $instructorName',
                                      style: TextStyle(color: colorScheme.onSurface.withOpacity(0.7)),
                                    ),
                                    SizedBox(height: 4),
                                    Text(
                                      'Notes: $notes',
                                      style: TextStyle(color: colorScheme.onSurface.withOpacity(0.7)),
                                    ),
                                  ],
                                ),
                              ),
                            );
                          },
                        ),
                ),
              ],
            ),
          ),
        ),
      ],
    );
  }
}
