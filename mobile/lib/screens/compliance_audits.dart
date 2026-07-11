import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;
import 'dart:convert';
import 'package:intl/intl.dart';
import '../config.dart';

class ComplianceAuditsScreen extends StatefulWidget {
  final String token;
  final VoidCallback onLogout;

  const ComplianceAuditsScreen({
    super.key,
    required this.token,
    required this.onLogout,
  });

  @override
  State<ComplianceAuditsScreen> createState() => _ComplianceAuditsScreenState();
}

class _ComplianceAuditsScreenState extends State<ComplianceAuditsScreen> {
  bool _isLoading = true;
  Map<String, dynamic>? _currentUser;
  List<dynamic> _findings = [];
  List<dynamic> _settings = [];
  List<dynamic> _users = [];

  final List<Map<String, String>> _knownRules = [
    {'key': '', 'label': '-- Select a parameter --', 'desc': ''},
    {'key': 'max_flight_hours_daily', 'label': 'Max Daily Flight Hours', 'desc': 'Maximum flight hours allowed in a single day'},
    {'key': 'max_duty_hours_daily', 'label': 'Max Daily Duty Hours', 'desc': 'Maximum duty hours allowed in a single day'},
    {'key': 'min_rest_hours', 'label': 'Minimum Rest Hours', 'desc': 'Minimum consecutive rest hours required between duty periods'},
    {'key': 'max_flight_hours_28_days', 'label': 'Max Flight Hours (28 Days)', 'desc': 'Maximum flight hours allowed in a 28-day period'},
    {'key': 'max_flight_hours_yearly', 'label': 'Max Yearly Flight Hours', 'desc': 'Maximum flight hours allowed in a calendar year'},
    {'key': 'currency_landings_90_days', 'label': '90-Day Landing Currency', 'desc': 'Required landings in the last 90 days'},
    {'key': 'medical_validity_months', 'label': 'Medical Validity (Months)', 'desc': 'Validity period of medical certificate in months'},
    {'key': 'max_wind_student_solo_knots', 'label': 'Max Wind - Student Solo (Knots)', 'desc': 'Maximum wind limit for student solo flights'},
  ];

  @override
  void initState() {
    super.initState();
    _fetchData();
  }

  bool get _isAdmin => _currentUser?['role'] == 'Administrator';

  Future<void> _fetchData() async {
    setState(() => _isLoading = true);
    try {
      final headers = {'Authorization': 'Bearer ${widget.token}'};
      
      final userRes = await http.get(Uri.parse('${Config.baseUrl}/api/users/me'), headers: headers);
      if (userRes.statusCode == 200) {
        _currentUser = json.decode(userRes.body);
      }

      final findRes = await http.get(Uri.parse('${Config.baseUrl}/api/findings/'), headers: headers);
      if (findRes.statusCode == 200) {
        _findings = json.decode(findRes.body);
      }

      final usersRes = await http.get(Uri.parse('${Config.baseUrl}/api/users/'), headers: headers);
      if (usersRes.statusCode == 200) {
        _users = json.decode(usersRes.body);
      }

      if (_isAdmin) {
        final setRes = await http.get(Uri.parse('${Config.baseUrl}/api/settings/'), headers: headers);
        if (setRes.statusCode == 200) {
          _settings = json.decode(setRes.body);
        }
      }
    } catch (e) {
      debugPrint('Error fetching compliance data: $e');
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  Future<void> _updateStatus(dynamic id, String newStatus) async {
    try {
      final res = await http.patch(
        Uri.parse('${Config.baseUrl}/api/findings/$id'),
        headers: {
          'Authorization': 'Bearer ${widget.token}',
          'Content-Type': 'application/json'
        },
        body: json.encode({'status': newStatus}),
      );
      if (res.statusCode == 200) {
        _fetchData();
      }
    } catch (e) {
      debugPrint('Update status error: $e');
    }
  }

  Future<void> _saveSetting(Map<String, dynamic> setting) async {
    try {
      final res = await http.post(
        Uri.parse('${Config.baseUrl}/api/settings/'),
        headers: {
          'Authorization': 'Bearer ${widget.token}',
          'Content-Type': 'application/json'
        },
        body: json.encode(setting),
      );
      if (res.statusCode == 200) {
        _fetchData();
      }
    } catch (e) {
      debugPrint('Save setting error: $e');
    }
  }

  Future<void> _showAddFindingDialog() async {
    final titleCtrl = TextEditingController();
    final descCtrl = TextEditingController();
    String level = 'Observation';
    String? assignedTo;
    DateTime? dueDate;

    await showDialog(
      context: context,
      builder: (ctx) {
        return StatefulBuilder(
          builder: (context, setDialogState) {
            return AlertDialog(
              title: const Text('Log Audit Finding'),
              content: SingleChildScrollView(
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    TextField(
                      controller: titleCtrl,
                      decoration: const InputDecoration(labelText: 'Title / Reference'),
                    ),
                    const SizedBox(height: 8),
                    TextField(
                      controller: descCtrl,
                      decoration: const InputDecoration(labelText: 'Description'),
                      maxLines: 3,
                    ),
                    const SizedBox(height: 8),
                    DropdownButtonFormField<String>(
                      value: level,
                      decoration: const InputDecoration(labelText: 'Level'),
                      items: ['Level 1', 'Level 2', 'Observation'].map((l) {
                        return DropdownMenuItem(value: l, child: Text(l));
                      }).toList(),
                      onChanged: (val) {
                        if (val != null) setDialogState(() => level = val);
                      },
                    ),
                    const SizedBox(height: 8),
                    ListTile(
                      contentPadding: EdgeInsets.zero,
                      title: const Text('Due Date for CAP'),
                      subtitle: Text(dueDate != null ? DateFormat('MMM dd, yyyy').format(dueDate!) : 'Not set'),
                      trailing: const Icon(Icons.calendar_today),
                      onTap: () async {
                        final picked = await showDatePicker(
                          context: context,
                          initialDate: DateTime.now(),
                          firstDate: DateTime.now(),
                          lastDate: DateTime(2100),
                        );
                        if (picked != null) {
                          setDialogState(() => dueDate = picked);
                        }
                      },
                    ),
                    const SizedBox(height: 8),
                    DropdownButtonFormField<String>(
                      value: assignedTo,
                      decoration: const InputDecoration(labelText: 'Assign To (Accountable Manager)'),
                      items: [
                        const DropdownMenuItem<String>(value: null, child: Text('-- Unassigned --')),
                        ..._users.map((u) => DropdownMenuItem<String>(
                          value: u['id'].toString(),
                          child: Text(u['full_name'] ?? 'Unknown'),
                        ))
                      ],
                      onChanged: (val) {
                        setDialogState(() => assignedTo = val);
                      },
                    ),
                  ],
                ),
              ),
              actions: [
                TextButton(
                  onPressed: () => Navigator.pop(context),
                  child: const Text('Cancel'),
                ),
                ElevatedButton(
                  onPressed: () async {
                    if (titleCtrl.text.isEmpty || descCtrl.text.isEmpty) return;
                    
                    final payload = {
                      'title': titleCtrl.text,
                      'description': descCtrl.text,
                      'level': level,
                      'assigned_to': assignedTo != null ? int.parse(assignedTo!) : null,
                      'due_date': dueDate?.toIso8601String(),
                    };

                    final res = await http.post(
                      Uri.parse('${Config.baseUrl}/api/findings/'),
                      headers: {
                        'Authorization': 'Bearer ${widget.token}',
                        'Content-Type': 'application/json'
                      },
                      body: json.encode(payload),
                    );

                    if (res.statusCode == 200 || res.statusCode == 201) {
                      Navigator.pop(context);
                      _fetchData();
                    } else {
                      if (mounted) {
                         ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Failed to add finding')));
                      }
                    }
                  },
                  child: const Text('Save Finding'),
                ),
              ],
            );
          }
        );
      }
    );
  }

  Future<void> _showAddRuleDialog() async {
    String ruleKey = '';
    final valCtrl = TextEditingController();
    final descCtrl = TextEditingController();

    await showDialog(
      context: context,
      builder: (ctx) {
        return StatefulBuilder(
          builder: (context, setDialogState) {
            return AlertDialog(
              title: const Text('Add Compliance Rule'),
              content: SingleChildScrollView(
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    DropdownButtonFormField<String>(
                      value: ruleKey,
                      decoration: const InputDecoration(labelText: 'Rule Key'),
                      isExpanded: true,
                      items: _knownRules.map((r) {
                        final val = r['key']!;
                        final label = val.isNotEmpty ? '$val - ${r['label']}' : r['label']!;
                        return DropdownMenuItem(value: val, child: Text(label, overflow: TextOverflow.ellipsis));
                      }).toList(),
                      onChanged: (val) {
                        if (val != null) {
                          setDialogState(() {
                            ruleKey = val;
                            final selected = _knownRules.firstWhere((r) => r['key'] == val, orElse: () => {});
                            if (selected.isNotEmpty && selected['desc']!.isNotEmpty) {
                              descCtrl.text = selected['desc']!;
                            }
                          });
                        }
                      },
                    ),
                    const SizedBox(height: 8),
                    TextField(
                      controller: valCtrl,
                      decoration: const InputDecoration(labelText: 'Value (e.g., 14)'),
                    ),
                    const SizedBox(height: 8),
                    TextField(
                      controller: descCtrl,
                      decoration: const InputDecoration(labelText: 'Description'),
                      maxLines: 3,
                    ),
                  ],
                ),
              ),
              actions: [
                TextButton(
                  onPressed: () => Navigator.pop(context),
                  child: const Text('Cancel'),
                ),
                ElevatedButton(
                  onPressed: () async {
                    if (ruleKey.isEmpty || valCtrl.text.isEmpty) return;
                    
                    final payload = {
                      'key': ruleKey,
                      'value': valCtrl.text,
                      'description': descCtrl.text,
                    };

                    final res = await http.post(
                      Uri.parse('${Config.baseUrl}/api/settings/'),
                      headers: {
                        'Authorization': 'Bearer ${widget.token}',
                        'Content-Type': 'application/json'
                      },
                      body: json.encode(payload),
                    );

                    if (res.statusCode == 200 || res.statusCode == 201) {
                      Navigator.pop(context);
                      _fetchData();
                    } else {
                      if (mounted) {
                         ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Failed to add rule')));
                      }
                    }
                  },
                  child: const Text('Save Rule'),
                ),
              ],
            );
          }
        );
      }
    );
  }

  Color _getLevelColor(String level, bool isText) {
    switch (level) {
      case 'Level 1': return isText ? Colors.red.shade800 : Colors.red.shade100;
      case 'Level 2': return isText ? Colors.orange.shade800 : Colors.orange.shade100;
      default: return isText ? Colors.blue.shade800 : Colors.blue.shade100;
    }
  }

  Color _getStatusColor(String status, bool isText) {
    switch (status) {
      case 'Open': return isText ? Colors.pink.shade800 : Colors.pink.shade100;
      case 'CAP Submitted': return isText ? Colors.amber.shade800 : Colors.amber.shade100;
      case 'Closed': return isText ? Colors.green.shade800 : Colors.green.shade100;
      default: return isText ? Colors.grey.shade800 : Colors.grey.shade100;
    }
  }

  String _getUserName(dynamic id) {
    if (id == null) return 'Unassigned';
    final u = _users.firstWhere((usr) => usr['id'].toString() == id.toString(), orElse: () => null);
    return u != null ? (u['full_name'] ?? 'Unassigned') : 'Unassigned';
  }

  String? _editingSettingKey;
  final TextEditingController _editSettingController = TextEditingController();

  @override
  Widget build(BuildContext context) {
    if (_isLoading) {
      return const Center(child: CircularProgressIndicator());
    }

    return DefaultTabController(
      length: _isAdmin ? 2 : 1,
      child: Column(
        children: [
          Container(
            color: Theme.of(context).colorScheme.surface,
            child: TabBar(
              labelColor: Theme.of(context).colorScheme.primary,
              unselectedLabelColor: Theme.of(context).colorScheme.onSurfaceVariant,
              indicatorColor: Theme.of(context).colorScheme.primary,
              tabs: [
                const Tab(icon: Icon(Icons.security), text: 'RCAA Findings & Audits'),
                if (_isAdmin)
                  const Tab(icon: Icon(Icons.settings), text: 'Compliance Rules Engine'),
              ],
            ),
          ),
          Expanded(
            child: TabBarView(
              children: [
                _buildFindingsTab(),
                if (_isAdmin)
                  _buildSettingsTab(),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildFindingsTab() {
    return Padding(
      padding: const EdgeInsets.all(16.0),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text('Audit Findings', style: Theme.of(context).textTheme.titleLarge?.copyWith(fontWeight: FontWeight.bold)),
                    Text('Track discrepancies and Corrective Action Plans (CAP)', style: Theme.of(context).textTheme.bodyMedium?.copyWith(color: Theme.of(context).colorScheme.onSurfaceVariant)),
                  ],
                ),
              ),
              ElevatedButton.icon(
                onPressed: _showAddFindingDialog,
                icon: const Icon(Icons.add),
                label: const Text('Log Finding'),
                style: ElevatedButton.styleFrom(
                  backgroundColor: Theme.of(context).colorScheme.primary,
                  foregroundColor: Theme.of(context).colorScheme.onPrimary,
                ),
              ),
            ],
          ),
          const SizedBox(height: 16),
          Expanded(
            child: _findings.isEmpty
                ? Center(
                    child: Text(
                      'No findings logged.',
                      style: TextStyle(color: Theme.of(context).colorScheme.onSurfaceVariant),
                    ),
                  )
                : ListView.builder(
                    itemCount: _findings.length,
                    itemBuilder: (context, index) {
                      final f = _findings[index];
                      return Card(
                        margin: const EdgeInsets.only(bottom: 12),
                        child: Padding(
                          padding: const EdgeInsets.all(16.0),
                          child: Row(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Expanded(
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Row(
                                      children: [
                                        Container(
                                          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                                          decoration: BoxDecoration(
                                            color: _getLevelColor(f['level'], false),
                                            borderRadius: BorderRadius.circular(4),
                                            border: Border.all(color: _getLevelColor(f['level'], true).withOpacity(0.5)),
                                          ),
                                          child: Text(
                                            f['level']?.toString() ?? 'Unknown',
                                            style: TextStyle(
                                              fontSize: 12,
                                              fontWeight: FontWeight.bold,
                                              color: _getLevelColor(f['level'], true),
                                            ),
                                          ),
                                        ),
                                        const SizedBox(width: 8),
                                        Expanded(
                                          child: Text(
                                            f['title'] ?? '',
                                            style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16),
                                          ),
                                        ),
                                      ],
                                    ),
                                    const SizedBox(height: 8),
                                    Text(
                                      f['description'] ?? '',
                                      style: TextStyle(color: Theme.of(context).colorScheme.onSurface),
                                    ),
                                    const SizedBox(height: 12),
                                    Wrap(
                                      spacing: 16,
                                      runSpacing: 8,
                                      children: [
                                        Row(
                                          mainAxisSize: MainAxisSize.min,
                                          children: [
                                            Icon(Icons.access_time, size: 14, color: Theme.of(context).colorScheme.onSurfaceVariant),
                                            const SizedBox(width: 4),
                                            Text(
                                              'Issued: ${f['date_issued'] != null ? DateFormat('MMM dd, yyyy').format(DateTime.parse(f['date_issued'])) : 'N/A'}',
                                              style: TextStyle(fontSize: 12, color: Theme.of(context).colorScheme.onSurfaceVariant),
                                            ),
                                          ],
                                        ),
                                        Row(
                                          mainAxisSize: MainAxisSize.min,
                                          children: [
                                            const Icon(Icons.warning_amber_rounded, size: 14, color: Colors.orange),
                                            const SizedBox(width: 4),
                                            Text(
                                              'Due: ${f['due_date'] != null ? DateFormat('MMM dd, yyyy').format(DateTime.parse(f['due_date'])) : 'N/A'}',
                                              style: TextStyle(fontSize: 12, color: Theme.of(context).colorScheme.onSurfaceVariant),
                                            ),
                                          ],
                                        ),
                                        Row(
                                          mainAxisSize: MainAxisSize.min,
                                          children: [
                                            Icon(Icons.person, size: 14, color: Theme.of(context).colorScheme.onSurfaceVariant),
                                            const SizedBox(width: 4),
                                            Text(
                                              'Assigned to: ${_getUserName(f['assigned_to'])}',
                                              style: TextStyle(fontSize: 12, fontWeight: FontWeight.w500, color: Theme.of(context).colorScheme.onSurface),
                                            ),
                                          ],
                                        ),
                                      ],
                                    ),
                                  ],
                                ),
                              ),
                              const SizedBox(width: 16),
                              Column(
                                crossAxisAlignment: CrossAxisAlignment.end,
                                children: [
                                  Container(
                                    padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
                                    decoration: BoxDecoration(
                                      color: _getStatusColor(f['status'], false),
                                      borderRadius: BorderRadius.circular(16),
                                    ),
                                    child: Text(
                                      f['status'] ?? '',
                                      style: TextStyle(
                                        fontSize: 12,
                                        fontWeight: FontWeight.bold,
                                        color: _getStatusColor(f['status'], true),
                                      ),
                                    ),
                                  ),
                                  if (f['status'] == 'Open')
                                    TextButton(
                                      onPressed: () => _updateStatus(f['id'], 'CAP Submitted'),
                                      child: const Text('Submit CAP', style: TextStyle(fontSize: 12)),
                                    ),
                                  if (f['status'] == 'CAP Submitted' && _isAdmin)
                                    TextButton(
                                      onPressed: () => _updateStatus(f['id'], 'Closed'),
                                      child: const Text('Close Finding', style: TextStyle(fontSize: 12, color: Colors.green)),
                                    ),
                                ],
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
    );
  }

  Widget _buildSettingsTab() {
    return Padding(
      padding: const EdgeInsets.all(16.0),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text('Adjustable Compliance Rules', style: Theme.of(context).textTheme.titleLarge?.copyWith(fontWeight: FontWeight.bold)),
                    Text('Modify school-level parameters that the legality engine uses.', style: Theme.of(context).textTheme.bodyMedium?.copyWith(color: Theme.of(context).colorScheme.onSurfaceVariant)),
                  ],
                ),
              ),
              ElevatedButton.icon(
                onPressed: _showAddRuleDialog,
                icon: const Icon(Icons.add),
                label: const Text('Add Rule'),
                style: ElevatedButton.styleFrom(
                  backgroundColor: Theme.of(context).colorScheme.primary,
                  foregroundColor: Theme.of(context).colorScheme.onPrimary,
                ),
              ),
            ],
          ),
          const SizedBox(height: 16),
          Expanded(
            child: ListView.builder(
              itemCount: _settings.length,
              itemBuilder: (context, index) {
                final s = _settings[index];
                final isEditing = _editingSettingKey == s['key'];
                
                return Card(
                  margin: const EdgeInsets.only(bottom: 12),
                  child: Padding(
                    padding: const EdgeInsets.all(16.0),
                    child: Row(
                      children: [
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(s['key'] ?? '', style: const TextStyle(fontWeight: FontWeight.bold, fontFamily: 'monospace')),
                              Text(
                                s['description'] ?? '', 
                                style: TextStyle(color: Theme.of(context).colorScheme.onSurfaceVariant, fontSize: 13),
                              ),
                            ],
                          ),
                        ),
                        if (isEditing) ...[
                          SizedBox(
                            width: 80,
                            child: TextField(
                              controller: _editSettingController,
                              textAlign: TextAlign.right,
                              decoration: const InputDecoration(isDense: true, contentPadding: EdgeInsets.symmetric(horizontal: 8, vertical: 8)),
                            ),
                          ),
                          const SizedBox(width: 8),
                          TextButton(
                            onPressed: () {
                              _saveSetting({
                                'key': s['key'],
                                'value': _editSettingController.text,
                                'description': s['description'],
                              });
                              setState(() => _editingSettingKey = null);
                            },
                            child: const Text('Save'),
                          ),
                          TextButton(
                            onPressed: () => setState(() => _editingSettingKey = null),
                            child: const Text('Cancel'),
                          ),
                        ] else ...[
                          Text(
                            s['value']?.toString() ?? '', 
                            style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: Theme.of(context).colorScheme.onSurface),
                          ),
                          const SizedBox(width: 16),
                          IconButton(
                            icon: const Icon(Icons.edit, size: 20),
                            color: Theme.of(context).colorScheme.primary,
                            onPressed: () {
                              setState(() {
                                _editingSettingKey = s['key'];
                                _editSettingController.text = s['value']?.toString() ?? '';
                              });
                            },
                          ),
                        ],
                      ],
                    ),
                  ),
                );
              },
            ),
          ),
        ],
      ),
    );
  }
}
